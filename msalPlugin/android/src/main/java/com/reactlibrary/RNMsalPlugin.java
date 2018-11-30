
package com.reactlibrary;

import android.app.Activity;
import android.content.Intent;
import android.util.Pair;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.microsoft.identity.client.AuthenticationCallback;
import com.microsoft.identity.client.AuthenticationResult;
import com.microsoft.identity.client.UiBehavior;
import com.microsoft.identity.client.exception.MsalException;
import com.microsoft.identity.client.PublicClientApplication;
import com.microsoft.identity.client.IAccount;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class RNMsalPlugin extends ReactContextBaseJavaModule implements ActivityEventListener {

    private static PublicClientApplication _publicClientApplication;

    public RNMsalPlugin(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return "RNMsalPlugin";
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        _publicClientApplication.handleInteractiveRequestRedirect(requestCode, resultCode, data);
    }

    @Override
    public void onNewIntent(Intent intent) {

    }

    @ReactMethod
    public void acquireTokenAsync(String authority, String clientId, ReadableArray scopes, ReadableMap extraParameters, String loginHint, String msalUIBehavior, ReadableArray extraScopesToConsent, final Promise promise) {

        try {

            String[] extraScopesToConsentArray = extraScopesToConsent.toArrayList().toArray(new String[0]);

            String[] scopesArray = scopes.toArrayList().toArray(new String[0]);

            List<Pair<String, String>> pairs = new ArrayList<>();

            HashMap extraParametersHashMap = extraParameters.toHashMap();

            for (Object o : extraParametersHashMap.entrySet()) {
                Map.Entry entry = (Map.Entry) o;
                Pair<String, String> pair = new Pair<>(entry.getKey().toString(), entry.getValue().toString());
                pairs.add(pair);
            }

            _publicClientApplication = new PublicClientApplication(this.getReactApplicationContext(), clientId, authority);

            _publicClientApplication.acquireToken(this.getCurrentActivity(), scopesArray, loginHint, UiBehavior.valueOf(msalUIBehavior), pairs, extraScopesToConsentArray, authority, handleResult(promise, authority));

        } catch (Exception ex) {
            promise.reject(ex);
        }
    }

    @ReactMethod
    public void acquireTokenSilentAsync(String authority, String clientId, ReadableArray scopes, String homeAccountIdentifier, Boolean forceRefresh, final Promise promise) {

        try {

            String[] scopesArray = scopes.toArrayList().toArray(new String[0]);

            _publicClientApplication = new PublicClientApplication(this.getReactApplicationContext(), clientId, authority);

            IAccount account = _publicClientApplication.getAccount(homeAccountIdentifier);

            _publicClientApplication.acquireTokenSilentAsync(scopesArray, account, authority, forceRefresh, handleResult(promise, authority));

        } catch (Exception ex) {
            promise.reject(ex);
        }
    }

    @ReactMethod
    public void tokenCacheDelete(String clientId, final Promise promise) {
        try {
            _publicClientApplication = new PublicClientApplication(this.getReactApplicationContext(), clientId);

            List<IAccount> accounts;

            accounts = _publicClientApplication.getAccounts();

            if (accounts.size() == 1) {
                _publicClientApplication.removeAccount(accounts.get(0));
                promise.resolve(true);
            } else {
                for (int i = 0; i < accounts.size(); i++) {
                    _publicClientApplication.removeAccount(accounts.get(i));
                }
                promise.resolve(true);
            }

        } catch (Exception ex) {
            promise.reject(ex);
        }
    }

    private AuthenticationCallback handleResult(final Promise promise, final String authority) {
        return new AuthenticationCallback() {
            @Override
            public void onSuccess(AuthenticationResult authenticationResult) {
                promise.resolve(msalResultToDictionary(authenticationResult, authority));
            }

            @Override
            public void onError(MsalException exception) {
                promise.reject(exception);
            }

            @Override
            public void onCancel() {
                promise.reject("userCancel", "userCancel");
            }
        };
    }

    private WritableMap msalResultToDictionary(AuthenticationResult result, String authority) {

        WritableMap resultData = new WritableNativeMap();
        resultData.putString("accessToken", result.getAccessToken());
        resultData.putString("idToken", result.getIdToken());
        resultData.putString("uniqueId", result.getUniqueId());
        resultData.putString("authority", authority);
        resultData.putString("expiresOn", String.format("%s", result.getExpiresOn().getTime()));
        resultData.putMap("userInfo", msalUserToDictionary(result.getAccount(), result.getTenantId()));
        return resultData;
    }

    private WritableMap msalUserToDictionary(IAccount account, String tenantId) {
        WritableMap resultData = new WritableNativeMap();
        resultData.putString("userName", account.getUsername());
        resultData.putString("userIdentifier", account.getHomeAccountIdentifier().getIdentifier());
        resultData.putString("name", account.getUsername());
        resultData.putString("environment", account.getEnvironment());
        resultData.putString("tenantId", tenantId);
        return resultData;
    }
}