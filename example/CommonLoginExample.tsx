import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MsalPlugin from "react-native-msal-plugin";
import {
  IAuthenticationResult,
  IError,
  MsalUIBehavior,
} from "react-native-msal-plugin";

const authority = "https://login.microsoftonline.com/common";
const clientId = "ad04905f-6060-4bb0-9372-958afdb68574";

const scopes = ["User.Read"] as string[];

interface IState {
  isLoggingIn: boolean;
  isLoggedin: boolean;
  authenticationResult: IAuthenticationResult;
  isRefreshingToken: boolean;
}

export default class CommonLoginExample extends React.Component<any, IState> {
  public authClient: MsalPlugin;

  constructor(props: any) {
    super(props);

    this.authClient = new MsalPlugin(authority, clientId);

    this.state = {
      isLoggingIn: false,
      isLoggedin: false,
      isRefreshingToken: false,
      authenticationResult: {} as IAuthenticationResult,
    };
  }

  public isLoggingIn = (value: boolean): void => {
    this.setState({
      isLoggingIn: value,
    });
  }

  public refreshingToken = (value: boolean): void => {
    this.setState({
      isRefreshingToken: value,
    });
  }

  public handleTokenRefresh = async (): Promise<void> => {
    this.refreshingToken(true);

    try {
      const result = await this.authClient.acquireTokenSilentAsync(
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
      // tslint:disable-next-line:no-console
      console.log(error);
    }
  }

  public handleLoginPress = async (): Promise<void> => {
    this.isLoggingIn(true);

    const extraQueryParameters: Record<string, string> = {
      myKeyOne: "myKeyOneValue",
      myKeyTwo: "myKeyTwoValue",
    };

    try {
      const result = await this.authClient.acquireTokenAsync(
        scopes,
        extraQueryParameters,
        "",
        MsalUIBehavior.FORCE_LOGIN,
      );

      this.authComplete(result);
    } catch (error) {
      this.isLoggingIn(false);
      // tslint:disable-next-line:no-console
      console.log(error);
    }
  }

  public authComplete = (result: IAuthenticationResult): void => {
    this.setState({
      isLoggingIn: false,
      isLoggedin: true,
      authenticationResult: result,
    });
  }

  public handleLogoutPress = () => {
    this.authClient
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

  public renderLogin() {
    return (
      <TouchableOpacity onPress={this.handleLoginPress}>
        <Text style={styles.button}>Login with common</Text>
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
