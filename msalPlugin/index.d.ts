declare module "react-native-msal-plugin"{

     interface IPolicies {
        signUpSignInPolicy: string;
        passwordResetPolicy?: string;
      }
      
       interface IError {
        code:number;
        message:string;
      }
      
       interface IAuthenticationResult{
          accessToken:string;
          idToken:string;
          uniqueId:string;
          authority:string;
          expiresOn:number;
          userInfo:IUserInfo;
      }
      
       interface IUserInfo{
        userID:string;
        userName:string;
        userIdentifier:string;
        name:string;
        identityProvider:string;
        tenantId:string;
      }
}