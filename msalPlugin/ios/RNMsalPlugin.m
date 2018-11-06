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
    
    MSALPublicClientApplication* clientApplication = [[MSALPublicClientApplication alloc] initWithClientId:clientId
                                                                                                 authority:authority
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
                                   authority:authority
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
    
    MSALPublicClientApplication* clientApplication = [[MSALPublicClientApplication alloc] initWithClientId:clientId
                                                                                                 authority:authority
                                                                                                     error:&error];
    if (error) {
      @throw(error);
    }
    
    if ([authority rangeOfString:@"login.microsoftonline.com" options:NSCaseInsensitiveSearch].location == NSNotFound) {
          clientApplication.validateAuthority = false;
    }

    MSALUser* user = [clientApplication userForIdentifier:homeAccountIdentifier
                    error:&error];
    
    if (error) {
      @throw(error);
    }
    
    [clientApplication acquireTokenSilentForScopes:scopes
                                              user:user
                                         authority:authority
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
    
    NSArray<MSALUser*>* users = [clientApplication users:&error];
    
    if (error) {
      @throw error;
    }
    
    for (MSALUser *user in users) {
      [clientApplication removeUser:user error:&error];
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
  [dict setObject:[self MSALUserToDictionary:result.user forTenant:result.tenantId] forKey:@"userInfo"];
  return [dict mutableCopy];
}

- (NSDictionary*)MSALUserToDictionary:(MSALUser*)user
                            forTenant:(NSString*)tenantid
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:1];
  [dict setObject:(user.uid ?: [NSNull null]) forKey:@"userID"];
  [dict setObject:(user.displayableId ?: [NSNull null]) forKey:@"userName"];
  [dict setObject:(user.userIdentifier ?: [NSNull null]) forKey:@"userIdentifier"];
  [dict setObject:(user.name ?: [NSNull null]) forKey:@"name"];
  [dict setObject:(user.identityProvider ?: [NSNull null]) forKey:@"identityProvider"];
  [dict setObject:(tenantid ?: [NSNull null]) forKey:@"tenantId"];
  return [dict mutableCopy];
}

@end
