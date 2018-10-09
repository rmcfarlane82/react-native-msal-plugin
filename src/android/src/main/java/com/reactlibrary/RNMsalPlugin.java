
package com.reactlibrary;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.microsoft.identity.client.AuthenticationCallback;
import com.microsoft.identity.client.AuthenticationResult;
import com.microsoft.identity.client.MsalException;
import com.microsoft.identity.client.PublicClientApplication;
import com.microsoft.identity.client.User;

import java.util.ArrayList;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RNMsalPlugin extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static PublicClientApplication _publicClientApplication;

    private static Map<String,PublicClientApplication> _publicClientApplications = new HashMap<>();

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
    public void acquireTokenAsync(String authority, String clientId, String scopes, String extraParameters, final Promise promise) {
        try {

            getOrCreatePublicationClient(clientId, authority).acquireToken(this.getCurrentActivity(), scopes.split(","), "", null, extraParameters, handleResult(promise, authority));

        } catch (Exception ex) {
            promise.reject(ex);
        }
    }

    @ReactMethod
    public void acquireTokenSilentAsync(String authority, String clientId, String scopes, String userIdentifier, final Promise promise){

        try {
            PublicClientApplication publicClientApplication = getOrCreatePublicationClient(clientId, authority);
            
            User user = publicClientApplication.getUser(userIdentifier);

            publicClientApplication.acquireTokenSilentAsync(scopes.split(","), user, handleResult(promise, authority));

        } catch (Exception ex) {
            promise.reject(ex);
        }
    }

    @ReactMethod
    public void tokenCacheDeleteItem(String authority, String clientId, String userIdentifier, final Promise promise){
        try {
            PublicClientApplication publicClientApplication = getOrCreatePublicationClient(clientId, authority);

            User user = publicClientApplication.getUser(userIdentifier);

            publicClientApplication.remove(user);

            promise.resolve(null);

        } catch (Exception ex) {
            promise.reject(ex);
        }
    }

    private AuthenticationCallback handleResult(final Promise promise, final String authority){
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

    private PublicClientApplication getOrCreatePublicationClient(String clientId, String authority) {

        _publicClientApplication = _publicClientApplications.get(authority);

        if(_publicClientApplication == null){
            _publicClientApplication = new PublicClientApplication(this.getReactApplicationContext(), clientId, authority);
            _publicClientApplication.setValidateAuthority(false);
            _publicClientApplications.put(authority,_publicClientApplication);
        }

        return _publicClientApplication;
    }

    private WritableMap msalResultToDictionary(AuthenticationResult result, String authority) {

        WritableMap resultData = new WritableNativeMap();
        resultData.putString("accessToken", result.getAccessToken());
        resultData.putString("idToken", result.getIdToken());
        resultData.putString("uniqueId", result.getUniqueId());
        resultData.putString("authority", authority);

        if (result.getExpiresOn() != null) {
            resultData.putString("expiresOn", String.format("%s", result.getExpiresOn().getTime()));
        }

        resultData.putMap("userInfo", msalUserToDictionary(result.getUser(), result.getTenantId()));

        return resultData;
    }

    private WritableMap msalUserToDictionary(User user, String tenantId) {
        WritableMap resultData = new WritableNativeMap();

        resultData.putString("userID", user.getDisplayableId());
        resultData.putString("userName", user.getDisplayableId());
        resultData.putString("userIdentifier", user.getUserIdentifier());
        resultData.putString("name", user.getName());
        resultData.putString("identityProvider", user.getIdentityProvider());
        resultData.putString("tenantId", tenantId);

        return resultData;
    }


}