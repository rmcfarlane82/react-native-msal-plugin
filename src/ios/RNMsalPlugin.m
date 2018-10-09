#import "RNMsalPlugin.h"
#import "React/RCTConvert.h"
#import "React/RCTLog.h"
#import <MSAL/MSAL.h>

@implementation RNMsalPlugin

RCT_EXPORT_MODULE();

static NSMutableDictionary* existingApplications = nil;


RCT_REMAP_METHOD(acquireTokenAsync,
                 authority:(NSString *)authority
                 clientId:(NSString *)clientId
                 scopes:(NSArray<NSString*>*)scopes
                 extraQueryParms:(NSString*)extraQueryParms
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject )
{
  @try {
    
    NSError* error = nil;
    MSALPublicClientApplication* clientApplication = [RNMsalPlugin getOrCreateClientApplication:authority withClientId:clientId error:&error];
    
    if (error) {
      @throw(error);
    }
    
    
    NSDictionary<NSString*,NSString*> *json = nil;
    if(extraQueryParms != nil){
      NSData *data = [extraQueryParms dataUsingEncoding:NSUTF8StringEncoding];
      json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    }
    
    
    [clientApplication acquireTokenForScopes:scopes
                        extraScopesToConsent:nil
                                        user:nil
                                  uiBehavior:MSALUIBehaviorDefault
                        extraQueryParameters:json
                                   authority:authority
                               correlationId:nil
                             completionBlock:^(MSALResult *result, NSError *error)
     {
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
                 userIdentitfier:(NSString*)userIdentifier
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSError* error = nil;
    MSALPublicClientApplication* clientApplication = [RNMsalPlugin getOrCreateClientApplication:authority
                                                                                   withClientId:clientId
                                                                                          error:&error];
    
    if (error) {
      @throw(error);
    }
    
    MSALUser* user = [clientApplication userForIdentifier:userIdentifier error:&error];
    
    if (error) {
      @throw(error);
    }
    
    [clientApplication acquireTokenSilentForScopes:scopes
                                              user:user
                                         authority:authority
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

RCT_REMAP_METHOD(tokenCacheDeleteItem,
                 authority:(NSString *)authority
                 clientId:(NSString *)clientId
                 userIdentitfier:(NSString*)userIdentifier
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  @try
  {
    NSError* error = nil;
    MSALPublicClientApplication* clientApplication = [RNMsalPlugin getOrCreateClientApplication:authority
                                                                                   withClientId:clientId
                                                                                        error:&error];
    
    if (error) {
      @throw error;
    }
    
    MSALUser* user = [clientApplication userForIdentifier:userIdentifier error:&error];
    
    if (error) {
      @throw error;
    }
    
    [clientApplication removeUser:user error:&error];
    
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
  
  if (result.expiresOn)
  {
    [dict setObject:[NSNumber numberWithDouble:[result.expiresOn timeIntervalSince1970] * 1000] forKey:@"expiresOn"];
  }
  
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

+ (MSALPublicClientApplication* )getOrCreateClientApplication:(NSString*)authority
                                                 withClientId:(NSString*)clientId
                                                        error:(NSError* __autoreleasing*)error
{
  if (!existingApplications)
  {
    existingApplications = [NSMutableDictionary dictionaryWithCapacity:1];
  }
  
  MSALPublicClientApplication* clientApplication = [existingApplications objectForKey:authority];
  
  if (!clientApplication)
  {
    NSError* _error;
    clientApplication = [[MSALPublicClientApplication alloc] initWithClientId:clientId authority:authority error:&_error];
    if (_error != nil)
    {
      *error = _error;
    }
    
    clientApplication.validateAuthority = false;
    
    [existingApplications setObject:clientApplication forKey:authority];
  }
  return clientApplication;
}

@end
