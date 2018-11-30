import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MsalPlugin, {
  IAuthenticationResult,
  IError,
  IPolicies,
  MsalUIBehavior,
} from "react-native-msal-plugin";

const authority =
  "https://reactnativemsalplugin.b2clogin.com/tfp/reactnativemsalplugin.onmicrosoft.com";
const applicationId = "134220b3-329f-406e-8020-c31f94c5ee32";
const policies = {
  signUpSignInPolicy: "B2C_1_signup-signin-policy",
  passwordResetPolicy: "B2C_1_password-reset-policy",
} as IPolicies;

const scopes = [
  "https://reactnativemsalplugin.onmicrosoft.com/react-native/user_impersonation",
] as string[];

interface IState {
  isLoggingIn: boolean;
  isLoggedin: boolean;
  authenticationResult: IAuthenticationResult;
  isRefreshingToken: boolean;
}

export default class B2CLoginExample extends React.Component<any, IState> {
  private msalPlugin: MsalPlugin;

  constructor(props: any) {
    super(props);

    this.msalPlugin = new MsalPlugin(authority, applicationId, policies);

    this.state = {
      isLoggingIn: false,
      isLoggedin: false,
      isRefreshingToken: false,
      authenticationResult: {} as IAuthenticationResult,
    };
  }

  public renderLogin() {
    return (
      <TouchableOpacity onPress={this.handleLoginPress}>
        <Text style={styles.button}>Login with b2c</Text>
      </TouchableOpacity>
    );
  }

  public renderRefreshToken() {
    return this.state.isRefreshingToken ? (
      <ActivityIndicator />
    ) : (
      <TouchableOpacity
        style={{ margin: 10 }}
        onPress={this.handleTokenRefresh}
      >
        <Text style={styles.button}>Refresh Token</Text>
      </TouchableOpacity>
    );
  }

  public renderLogout() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Hi {this.state.authenticationResult.userInfo.name}!
        </Text>
        <Text style={styles.expiresOn}>
          Token Expires On {this.state.authenticationResult.expiresOn}
        </Text>
        {this.renderRefreshToken()}
        <TouchableOpacity onPress={this.handleLogoutPress}>
          <Text style={styles.button}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  public render() {
    return (
      <View style={styles.container}>
        {this.state.isLoggingIn && <ActivityIndicator />}
        {this.state.isLoggedin &&
          !this.state.isLoggingIn &&
          this.renderLogout()}
        {!this.state.isLoggedin &&
          !this.state.isLoggingIn &&
          this.renderLogin()}
      </View>
    );
  }

  private isLoggingIn = (value: boolean): void => {
    this.setState({
      isLoggingIn: value,
    });
  }

  private refreshingToken = (value: boolean): void => {
    this.setState({
      isRefreshingToken: value,
    });
  }

  private handleTokenRefresh = async (): Promise<void> => {
    this.refreshingToken(true);

    try {
      const result = await this.msalPlugin.acquireTokenSilentAsync(
        scopes,
        this.state.authenticationResult.userInfo.userIdentifier,
        true,
      );

      this.setState({
        isRefreshingToken: false,
        isLoggedin: true,
        authenticationResult: result,
      });
    } catch (error) {
      this.refreshingToken(false);
    }
  }

  private handleLoginPress = async (): Promise<void> => {
    this.isLoggingIn(true);

    const extraQueryParameters: Record<string, string> = {
      myKeyOne: "myKeyOneValue",
      myKeyTwo: "myKeyTwoValue",
    };

    try {
      const result = await this.msalPlugin.acquireTokenAsync(
        scopes,
        extraQueryParameters,
        "",
        MsalUIBehavior.SELECT_ACCOUNT,
      );
      this.setState({
        isLoggingIn: false,
        isLoggedin: true,
        authenticationResult: result,
      });
    } catch (error) {
      console.log(error);
      this.isLoggingIn(false);
    }
  }

  private handleLogoutPress = () => {
    this.msalPlugin
      .tokenCacheDelete()
      .then(() => {
        this.setState({
          isLoggedin: false,
          authenticationResult: {} as IAuthenticationResult,
        });
      })
      .catch((error: IError) => {
        // tslint:disable-next-line:no-console
        console.log(error.message);
      });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 20,
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5,
  },
  expiresOn: {
    fontSize: 15,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#DDDDDD",
    padding: 10,
  },
});
