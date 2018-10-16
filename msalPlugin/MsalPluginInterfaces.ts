export interface IPolicies {
  signUpSignInPolicy: string;
  passwordResetPolicy?: string;
}

export interface IError {
  code: number;
  message: string;
}

export interface IAuthenticationResult {
    accessToken: string;
    idToken: string;
    uniqueId: string;
    authority: string;
    expiresOn: number;
    userInfo: IUserInfo;
}

export interface IUserInfo {
  userID: string;
  userName: string;
  userIdentifier: string;
  name: string;
  identityProvider: string;
  tenantId: string;
}
