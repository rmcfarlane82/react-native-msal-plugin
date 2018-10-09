# react-native-msal-plugin

Wrapper around Microsofts [MSAL](https://github.com/samcolby/react-native-ms-adal/) library


Tested  on [React Native](https://facebook.github.io/react-native/) 0.57.1


## Installation

``` sh
npm install react-native-msal-plugin
```
or
``` sh
yarn add react-native-msal-plugin
```

Link the library
``` sh
react-native link react-native-msal-plugin
```

## IOS Setup
### Requirements

  * [Cocoapods](https://cocoapods.org/)

Install [MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-objc) with cocoapods

Add the following to the Podfile and run ```pod install```

``` ruby
pod 'MSAL', :git => 'https://github.com/AzureAD/microsoft-authentication-library-for-objc.git', :tag => '0.1.3'
```

## Android Setup

Add Browser tab activity to your AndroidManifest.xml make sure to replace [REPLACE_WITH_YOUR_APPLICATION_ID] with your own application id

``` xml
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
import MsalPlugin from 'react-native-msal-plugin';

const authority = 'https://login.microsoftonline.com/common';
const clientId='ad04905f-6060-4bb0-9372-958afdb68574';
const scopes = ['User.Read'];

const authClient = MsalPlugin(authority, clientId);

authClient.acquireTokenAsync(scopes)
  .then((data)=> {

  }).catch((err) => {

  });
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
const scopes = [
  "https://{domain}.onmicrosoft.com/{app id}/user_impersonation"
];

const authClient = new MsalPlugin(authority, applicationId);

authClient.aquireTokenB2CAsync(scopes, policies)
.then(result => {
  console.log(result);
}).catch(error => {
  console.log(error);
});

```
