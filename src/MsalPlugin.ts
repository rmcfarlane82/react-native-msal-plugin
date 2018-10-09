// @ts-ignore
import { NativeModules, Platform } from "react-native";
import {
  IAuthenticationResult,
  IError,
  IPolicies,
} from "./MsalPluginInterfaces";

const { RNMsalPlugin } = NativeModules;
const RESET_PASSWORD_CODE = "AADB2C90118";
const delay = (t: any) => new Promise((resolve) => setTimeout(resolve, t));

export default class MsalPlugin {
  private authority: string;
  private clientId: string;
  private b2cAuthority: string;

  constructor(authority: string, clientId: string) {
    this.authority = authority;
    this.clientId = clientId;
    this.b2cAuthority = authority;
  }

  public acquireTokenAsync = (
    scopes: string[],
    extraQueryParameters?: Record<string, string>,
  ): Promise<IAuthenticationResult> => {
    return RNMsalPlugin.acquireTokenAsync(
      this.b2cAuthority,
      this.clientId,
      Platform.OS === "ios" ? scopes : scopes.join(","),
      JSON.stringify(extraQueryParameters),
    );
  }

  public aquireTokenB2CAsync = (
    scopes: string[],
    policies: IPolicies,
    extraQueryParameters?: Record<string, string>,
    beforePasswordReset?: () => {},
  ): IAuthenticationResult => {
    this._addPolicyToAuthority(policies.signUpSignInPolicy);

    return RNMsalPlugin.acquireTokenAsync(
      this.b2cAuthority,
      this.clientId,
      Platform.OS === "ios" ? scopes : scopes.join(","),
      JSON.stringify(extraQueryParameters),
    ).catch((error: IError) => {
      if (
        error.message.includes(RESET_PASSWORD_CODE) &&
        policies.passwordResetPolicy
      ) {
        if (beforePasswordReset) {
          beforePasswordReset();
        }
        return this.resetPasswordAsync(
          scopes,
          policies.passwordResetPolicy,
          extraQueryParameters,
        );
      } else {
        throw error;
      }
    });
  }

  public acquireTokenSilentAsync = (
    scopes: string[],
    userIdentitfier: string,
    authority: string,
  ): Promise<IAuthenticationResult> => {
    return RNMsalPlugin.acquireTokenSilentAsync(
      authority,
      this.clientId,
      Platform.OS === "ios" ? scopes : scopes.join(","),
      userIdentitfier,
    );
  }

  public tokenCacheDeleteItem = (userIdentitfier: string): Promise<void> => {
    return RNMsalPlugin.tokenCacheDeleteItem(
      this.authority,
      this.clientId,
      userIdentitfier,
    );
  }

  public tokenCacheB2CDeleteItem = (
    authority: string,
    userIdentitfier: string,
  ): Promise<void> => {
    return RNMsalPlugin.tokenCacheDeleteItem(
      authority,
      this.clientId,
      userIdentitfier,
    );
  }

  private resetPasswordAsync = (
    scopes: string[],
    passwordResetPolicy: string,
    extraQueryParameters?: Record<string, string>,
  ): Promise<IAuthenticationResult> => {
    const self = this;

    this._addPolicyToAuthority(passwordResetPolicy);

    // had to use a delay otherwise exception is thrown, only one interactive session allowed
    // if anyone knows a better way feel free to fix
    return delay(1000).then(() => {
      return RNMsalPlugin.acquireTokenAsync(
        self.b2cAuthority,
        self.clientId,
        Platform.OS === "ios" ? scopes : scopes.join(","),
        JSON.stringify(extraQueryParameters),
      );
    });
  }

  private _addPolicyToAuthority(policy: string): void {
    this.b2cAuthority = this.authority + "/" + policy;
  }
}
