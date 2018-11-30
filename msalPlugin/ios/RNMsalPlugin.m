#import "RNMsalPlugin.h"
#import "React/RCTConvert.h"
#import "React/RCTLog.h"
#import <MSAL/MSAL.h>

@implementation RNMsalPlugin


RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(acquireTokenAsync,
                  authority:(NSString *)authority
                  clientId:(NSString *)clientId
                  scopes:(NSArray<NSString*>*)scopes
                  extraQueryParams:(NSDictionary*)extraQueryParams
                  loginHint:(NSString*)loginHint
                  msalUIBehavior:(NSString*)msalUIBehavior
                  extraScopesToConsent:(NSArray<NSString*>*)extraScopesToConsent
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSError* error = nil;
    
    NSURL* authorityUrl = [NSURL URLWithString:authority];
    
    MSALAuthority* msalAuthority = [MSALAuthority authorityWithURL:authorityUrl
                                                             error:&error];
    
    if(error){
      @throw(error);
    }
    
    MSALPublicClientApplication* clientApplication = [[MSALPublicClientApplication alloc] initWithClientId:clientId
    keychainGroup:keychainGroup
                                                                                                 authority:msalAuthority
                                                                                                     error:&error];
    if (error) {
      @throw(error);
    }
    
    if ([authority rangeOfString:@"login.microsoftonline.com" options:NSCaseInsensitiveSearch].location == NSNotFound) {
          clientApplication.validateAuthority = false;
    }

    NSDictionary<NSString*, NSNumber*>* behaviorDictionary = @{@"FORCE_LOGIN": @(MSALForceLogin),
                                          @"SELECT_ACCOUNT": @(MSALSelectAccount),
                                          @"CONSENT": @(MSALForceConsent)};
    
    MSALUIBehavior behavior = behaviorDictionary[msalUIBehavior].integerValue;
    
    [clientApplication acquireTokenForScopes:scopes
                        extraScopesToConsent:extraScopesToConsent
                                   loginHint:loginHint
                                  uiBehavior:behavior
                        extraQueryParameters:extraQueryParams
                                   authority:msalAuthority
                               correlationId:[NSUUID new]
                             completionBlock:^(MSALResult *result, NSError *error) {
                               if(error) {
                                 reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
                               } else {
                                 resolve([self MSALResultToDictionary:result authority:authority]);
                               }
                             }];
  }
  @catch (NSError* error)
  {
    reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
  }
}
                   
RCT_REMAP_METHOD(acquireTokenSilentAsync,
                  authority:(NSString *)authority
                  clientId:(NSString *)clientId
                  scopes:(NSArray<NSString*>*)scopes
                  homeAccountIdentifier:(NSString*)homeAccountIdentifier
                  forceRefresh:(BOOL)forceRefresh
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSError* error = nil;
    
    NSURL* authorityUrl = [NSURL URLWithString:authority];
    
    MSALAuthority* msalAuthority = [MSALAuthority authorityWithURL:authorityUrl
                                                             error:&error];
    
    if(error){
      @throw(error);
    }
    
    MSALPublicClientApplication* clientApplication = [[MSALPublicClientApplication alloc] initWithClientId:clientId
                                                                                                 authority:msalAuthority
                                                                                                     error:&error];
    if (error) {
      @throw(error);
    }
    
    if ([authority rangeOfString:@"login.microsoftonline.com" options:NSCaseInsensitiveSearch].location == NSNotFound) {
          clientApplication.validateAuthority = false;
    }

    MSALAccount* account = [clientApplication accountForHomeAccountId:homeAccountIdentifier
                    error:&error];
    
    if (error) {
      @throw(error);
    }
    
    [clientApplication acquireTokenSilentForScopes:scopes
                                              account:account
                                         authority:msalAuthority
                                      forceRefresh:forceRefresh
                                     correlationId:nil
                                   completionBlock:^(MSALResult *result, NSError *error) {
                                     if(error) {
                                       reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
                                     } else {
                                       resolve([self MSALResultToDictionary:result
                                                                  authority:authority]);
                                     }
                                   }];
  }
  @catch(NSError* error)
  {
    reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
  }
}

RCT_REMAP_METHOD(tokenCacheDelete,
                 clientId:(NSString *)clientId
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  @try
  {
    NSError* error = nil;
    MSALPublicClientApplication* clientApplication = [[MSALPublicClientApplication alloc] initWithClientId:clientId
                                                                                                     error:&error];
    if (error) {
      @throw error;
    }
    
    NSArray<MSALAccount*>* accounts = [clientApplication allAccounts:&error];
    
    if (error) {
      @throw error;
    }
    
    for (MSALAccount *account in accounts) {
      [clientApplication removeAccount:account error:&error];
    }
    
    if (error) {
      @throw error;
    }
    
    resolve([NSNull null]);
    
  }
  @catch(NSError* error)
  {
    reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
  }
}

- (NSDictionary*)MSALResultToDictionary:(MSALResult*)result
                              authority:(NSString*)authority
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:1];
  [dict setObject:(result.accessToken ?: [NSNull null]) forKey:@"accessToken"];
  [dict setObject:(result.idToken ?: [NSNull null]) forKey:@"idToken"];
  [dict setObject:(result.uniqueId) ?: [NSNull null] forKey:@"uniqueId"];
  [dict setObject:(authority) ?: [NSNull null] forKey:@"authority"];
  [dict setObject:[NSNumber numberWithDouble:[result.expiresOn timeIntervalSince1970] * 1000] forKey:@"expiresOn"];
  [dict setObject:[self MSALUserToDictionary:result.account forTenant:result.tenantId] forKey:@"userInfo"];
  return [dict mutableCopy];
}

- (NSDictionary*)MSALUserToDictionary:(MSALAccount*)account
                            forTenant:(NSString*)tenantid
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:1];
  [dict setObject:(account.username ?: [NSNull null]) forKey:@"userName"];
  [dict setObject:(account.homeAccountId.identifier ?: [NSNull null]) forKey:@"userIdentifier"];
  [dict setObject:(account.environment ?: [NSNull null]) forKey:@"environment"];
  [dict setObject:(tenantid ?: [NSNull null]) forKey:@"tenantId"];
  return [dict mutableCopy];
}

@end
