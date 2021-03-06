# react-native-msal-plugin

### **Very sorry but I no longer have enough time to keep this package updated, I highly recommend using [react-native-msal by stashenergy](https://github.com/stashenergy/react-native-msal), thanks for the support.**

[ChangeLog](docs/changelog.md)

Wrapper around [microsoft-authentication-library-for-objc](https://github.com/AzureAD/microsoft-authentication-library-for-objc) library and [microsoft-authentication-library-for-android](https://github.com/AzureAD/microsoft-authentication-library-for-android)

Tested on [React Native](https://facebook.github.io/react-native/) 0.57.1

Based on [bjartebore repo](https://github.com/bjartebore/react-native-msal-client)

[![npm version](https://badge.fury.io/js/react-native-msal-plugin.svg)](https://badge.fury.io/js/react-native-msal-plugin)

[![Build status](https://dev.azure.com/dogbytes/react-native-msal-plugin/_apis/build/status/react-native-msal-plugin-CI)](https://dev.azure.com/dogbytes/react-native-msal-plugin/_apis/build/status/react-native-msal-plugin-CI)

```sh
npm install react-native-msal-plugin
```

or

```sh
yarn add react-native-msal-plugin
```

Link the library

```sh
react-native link react-native-msal-plugin
```

## IOS Setup

### Requirements

- [Cocoapods](https://cocoapods.org/)

### Install the required Pod

Install [microsoft-authentication-library-for-objc](https://github.com/AzureAD/microsoft-authentication-library-for-objc) with cocoapods

Create a Podfile in the ios project and add the following

```ruby

platform :ios, '10'

target 'msalExample' do

  # Pods for msalExample
  pod 'MSAL', '~> 0.2'
end

```

Open Terminal in the same directory as the Podfile and run `pod install`

### Add Url Scheme

Open the info.plist and add a url scheme that contains the callback url.

Make sure to replace [REPLACE_WITH_YOUR_APPLICATION_ID] with your own application id

```xml

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>msal[REPLACE_WITH_YOUR_APPLICATION_ID]</string>
    </array>
  </dict>
</array>

```

Handle the redirection of the browser, Open the AppDelegate.m file and import msal.h

```objc

#import <MSAL/MSAL.h>

```

Then add this method

```objc

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *,id> *)options
  {

    [MSALPublicClientApplication handleMSALResponse:url];
    return YES;
  }

@end
```

The msal library uses ASWebAuthenticationsession for authentication on ios12 so you will have to add a new keychain group.
to find out more read the docs [https://github.com/AzureAD/microsoft-authentication-library-for-objc](https://github.com/AzureAD/microsoft-authentication-library-for-objc)

![alt text](docs/keychain-steps.png)

## Android Setup

Add Browser tab activity to your AndroidManifest.xml make sure to replace [REPLACE_WITH_YOUR_APPLICATION_ID] with your own application id

```xml
 <activity
    android:name=".MainActivity"
    android:label="@string/app_name"
    android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
    android:windowSoftInputMode="adjustResize">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
  </activity>
  <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" />

  <!-- Browser tab activity -->
  <activity
    android:name="com.microsoft.identity.client.BrowserTabActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="msal[REPLACE_WITH_YOUR_APPLICATION_ID]"
            android:host="auth" />
    </intent-filter>
 </activity>
```

# Usage

### Common endpoint

```js
import MsalPlugin from "react-native-msal-plugin";

const authority = "https://login.microsoftonline.com/common";

const clientId = "ad04905f-6060-4bb0-9372-958afdb68574";

const scopes = ["User.Read"];

const extraQueryParameters = {
  exampleParamOne: "exampleParamOneValue",
  exampleParamTwo: "exampleParamTwoValue"
};

const login_hint = "user@domain.com";

const authClient = new MsalPlugin(authority, clientId);

const forceTokenRefresh = false;

let tokenResult = {};

// acquire token
try {
  tokenResult = await this.authClient.acquireTokenAsync(
    scopes,
    extraQueryParameters,
    login_hint,
    MsalUIBehavior.SELECT_ACCOUNT
  );
  console.log("Store the token", tokenResult);
} catch (error) {
  console.log(error);
}

// acquire token silent
try {
  const silentTokenresult = await this.authClient.acquireTokenSilentAsync(
    scopes,
    tokenResult.userInfo.userIdentifier,
    forceTokenRefresh
  );
  console.log("Store the new token", silentTokenresult);
} catch (error) {
  console.log(error);
}

// sign out
try {
  await this.authClient.tokenCacheDelete();
} catch (error) {
  console.log(error);
}
```

### Azure B2C endpoint

```js
import MsalPlugin from "react-native-msal-plugin";

const authority = "https://{domain}.b2clogin.com/tfp/{domain}.onmicrosoft.com";

const applicationId = "{applicationId}";

const policies = {
  signUpSignInPolicy: "B2C_1_signup-signin-policy",
  passwordResetPolicy: "B2C_1_Password-reset-policy"
};

const scopes = ["https://{domain}.onmicrosoft.com/{app id}/user_impersonation"];

const extraQueryParameters = {
  exampleParamOne: "exampleParamOneValue",
  exampleParamTwo: "exampleParamTwoValue"
};

const login_hint = "user@domain.com";

const authClient = new MsalPlugin(authority, applicationId, policies);

const forceTokenRefresh = false;

let tokenResult = {};

// acquire Token
try {
  tokenResult = await this.msalPlugin.acquireTokenAsync(
    scopes,
    extraQueryParameters,
    login_hint,
    MsalUIBehavior.SELECT_ACCOUNT
  );
  console.log("Store the token", tokenResult);
} catch (error) {
  console.log(error);
}

// acquire Token Silent
try {
  const silentTokenresult = await this.msalPlugin.acquireTokenSilentAsync(
    scopes,
    tokenResult.userInfo.userIdentifier,
    forceTokenRefresh
  );

  console.log("Store the new token", silentTokenresult);
} catch (error) {
  console.log(error);
}

// sign out
try {
  await this.authClient.tokenCacheDelete();
} catch (error) {
  console.log(error);
}
```
