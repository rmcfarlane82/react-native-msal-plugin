import { NativeModules } from "react-native";
import {
  IAuthenticationResult,
  IError,
  IPolicies,
} from "./MsalPluginInterfaces";
import { MsalUIBehavior } from "./MsalUIBehavior";

const { RNMsalPlugin } = NativeModules;
const RESET_PASSWORD_CODE = "AADB2C90118";
const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export default class MsalPlugin {
  private authority: string;
  private clientId: string;
  private policies: IPolicies;

  private defaultPolicy: IPolicies = {
    signUpSignInPolicy: "",
  };

  constructor(authority: string, clientId: string, policies?: IPolicies) {
    this.authority = authority;
    this.clientId = clientId;
    this.policies = policies || this.defaultPolicy;
  }

  public acquireTokenAsync = (
    scopes: string[],
    extraQueryParameters: Record<string, string> = {},
    loginHint: string = "",
    msalUIBehavior: MsalUIBehavior = MsalUIBehavior.SELECT_ACCOUNT,
    extraScopesToConsent: string[] = [],
  ): Promise<IAuthenticationResult> => {
    return RNMsalPlugin.acquireTokenAsync(
      this.getAuthority(this.policies.signUpSignInPolicy),
      this.clientId,
      scopes,
      extraQueryParameters,
      loginHint,
      msalUIBehavior,
      extraScopesToConsent,
    ).catch((error: IError) => {
      if (
        error.message.includes(RESET_PASSWORD_CODE) &&
        this.policies.passwordResetPolicy
      ) {
        return this.resetPasswordAsync(
          scopes,
          extraQueryParameters,
          loginHint,
          msalUIBehavior,
          extraScopesToConsent,
        );
      } else {
        throw error;
      }
    });
  }

  public acquireTokenSilentAsync = (
    scopes: string[],
    userIdentifier: string,
    forceRefresh: boolean = false,
  ): Promise<IAuthenticationResult> => {
    return RNMsalPlugin.acquireTokenSilentAsync(
      this.getAuthority(this.policies.signUpSignInPolicy),
      this.clientId,
      scopes,
      userIdentifier,
      forceRefresh,
    );
  }

  public tokenCacheDelete = (): Promise<boolean> => {
    return RNMsalPlugin.tokenCacheDelete(this.clientId);
  }

  public resetPasswordAsync = async (
    scopes: string[],
    extraQueryParameters: Record<string, string> = {},
    loginHint: string = "",
    msalUIBehavior: MsalUIBehavior = MsalUIBehavior.SELECT_ACCOUNT,
    extraScopesToConsent: string[] = [],
  ): Promise<IAuthenticationResult> => {
    // had to use a delay otherwise exception is thrown, only one interactive session allowed
    // if anyone knows a better way feel free to fix
    return delay(1000).then(async () => {
      try {
        await RNMsalPlugin.acquireTokenAsync(
          this.getAuthority(this.policies.passwordResetPolicy),
          this.clientId,
          scopes,
          extraQueryParameters,
          loginHint,
          msalUIBehavior,
          extraScopesToConsent,
        );

        return await this.acquireTokenAsync(
          scopes,
          extraQueryParameters,
          loginHint,
          msalUIBehavior,
          extraScopesToConsent,
        );
      } catch (error) {
        throw error;
      }
    });
  }

  private getAuthority(policy: string | undefined): string {
    return policy ? this.authority + "/" + policy : this.authority;
  }
}
