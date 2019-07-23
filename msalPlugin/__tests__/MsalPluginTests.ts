const mockAcquireTokenAsync = jest.fn();
const mockAcquireTokenSilentAsync = jest.fn();
const mockTokenCacheDelete = jest.fn();

jest.mock("NativeModules", () => {
    return {
        RNMsalPlugin: {
            acquireTokenAsync: mockAcquireTokenAsync,
            acquireTokenSilentAsync: mockAcquireTokenSilentAsync,
            tokenCacheDelete: mockTokenCacheDelete,
        },
    };
});

import MsalPlugin from "../MsalPlugin";
import { IError, IPolicies } from "../MsalPluginInterfaces";
import { MsalUIBehavior } from "../MsalUIBehavior";

const policies: IPolicies = {
    signUpSignInPolicy: "signUpSignInPolicy",
    passwordResetPolicy: "passwordResetPolicy",
};
const scopes = ["scope1", "scope2"];
const extraQueryParameters = {
    myKeyOne: "myKeyOneValue",
    myKeyTwo: "myKeyTwoValue",
};
const loginHint = "user@test.com";
const extraScopesToConsent = ["consentScope1", "consentScope2"];
const authority = "http://testAuthority.com";
const clientId = "0123456789";

beforeEach(() => {
    mockAcquireTokenAsync.mockClear();
    mockAcquireTokenSilentAsync.mockClear();
    mockTokenCacheDelete.mockClear();
});

describe("acquireTokenAsync tests", () => {

    test("WHEN acquiring token THEN native module should be called with correct parameters", async () => {

        // arrange
        mockAcquireTokenAsync.mockResolvedValue({});

        const sut = new MsalPlugin(authority, clientId);

        // act
        await sut.acquireTokenAsync(scopes, extraQueryParameters,
            loginHint, MsalUIBehavior.SELECT_ACCOUNT, extraScopesToConsent);

        // assert
        expect(mockAcquireTokenAsync).toBeCalledWith(
            authority,
            clientId,
            scopes,
            extraQueryParameters,
            loginHint,
            MsalUIBehavior.SELECT_ACCOUNT,
            extraScopesToConsent,
        );
    });

    test("WHEN using policies to acquire token THEN should use correct authority", async () => {

        // arrange
        mockAcquireTokenAsync.mockResolvedValue({});

        const sut = new MsalPlugin(authority, clientId, policies);

        // act
        await sut.acquireTokenAsync(scopes, extraQueryParameters,
            loginHint, MsalUIBehavior.SELECT_ACCOUNT, extraScopesToConsent);

        // assert
        expect(mockAcquireTokenAsync).toBeCalledWith(
            authority + "/" + policies.signUpSignInPolicy,
            clientId,
            scopes,
            extraQueryParameters,
            loginHint,
            MsalUIBehavior.SELECT_ACCOUNT,
            extraScopesToConsent,
        );
    });

    test("WHEN acquire token fails THEN error is thrown", async () => {

        // arrange
        const error: IError = {
            message: "some error message",
            code: 1234,
        };

        mockAcquireTokenAsync.mockRejectedValueOnce(error);

        const sut = new MsalPlugin(authority, clientId, policies);

        try {
            // act
            await sut.acquireTokenAsync(scopes, extraQueryParameters,
                loginHint, MsalUIBehavior.SELECT_ACCOUNT, extraScopesToConsent);
        } catch (err) {

            // assert
            expect(err).toBe(error);
        }
    });

    describe("Scenario: user forgets password", () => {

        // tslint:disable-next-line:max-line-length
        test("WHEN error message contains AADB2C90118 and password policy is NOT set THEN error is thrown", async () => {

            // arrange
            const RESET_PASSWORD_CODE = "AADB2C90118";

            const error: IError = {
                message: "user forgot password " + RESET_PASSWORD_CODE,
                code: 1234,
            };

            mockAcquireTokenAsync
                .mockRejectedValueOnce(error);

            const sut = new MsalPlugin(authority, clientId, {
                signUpSignInPolicy: "signUpSignInPolicy",
            });

            try {
                // act
                await sut.acquireTokenAsync(scopes, extraQueryParameters,
                    loginHint, MsalUIBehavior.SELECT_ACCOUNT, extraScopesToConsent);
            } catch (err) {
                expect(err).toBe(error);
            }
        });

        // tslint:disable-next-line:max-line-length
        test("WHEN error message contains AADB2C90118 and password policy is set THEN should call acquireTokenAsync with password policy", async () => {

            // arrange
            const RESET_PASSWORD_CODE = "AADB2C90118";

            const error: IError = {
                message: "user forgot password " + RESET_PASSWORD_CODE,
                code: 1234,
            };

            mockAcquireTokenAsync
                .mockRejectedValueOnce(error)
                .mockResolvedValue({} as Promise<any>);

            const sut = new MsalPlugin(authority, clientId, policies);

            // act
            await sut.acquireTokenAsync(scopes, extraQueryParameters,
                loginHint, MsalUIBehavior.SELECT_ACCOUNT, extraScopesToConsent);

            // assert
            expect(mockAcquireTokenAsync.mock.calls[1]).toEqual([
                authority + "/" + policies.passwordResetPolicy,
                clientId,
                scopes,
                extraQueryParameters,
                loginHint,
                MsalUIBehavior.SELECT_ACCOUNT,
                extraScopesToConsent,
            ]);
        });

        test("WHEN reset password resolves THEN should call aquireTokenAsync with correct parameters", async () => {

            // arrange
            const RESET_PASSWORD_CODE = "AADB2C90118";

            const error: IError = {
                message: "user forgot password " + RESET_PASSWORD_CODE,
                code: 1234,
            };

            mockAcquireTokenAsync
                .mockRejectedValueOnce(error)
                .mockResolvedValue({} as Promise<any>)
                .mockResolvedValue({} as Promise<any>);

            const sut = new MsalPlugin(authority, clientId, policies);

            // act
            await sut.acquireTokenAsync(scopes, extraQueryParameters,
                loginHint, MsalUIBehavior.SELECT_ACCOUNT, extraScopesToConsent);

            // assert
            expect(mockAcquireTokenAsync.mock.calls[2]).toEqual([
                authority + "/" + policies.signUpSignInPolicy,
                clientId,
                scopes,
                extraQueryParameters,
                loginHint,
                MsalUIBehavior.SELECT_ACCOUNT,
                extraScopesToConsent,
            ]);
        });

        test("WHEN reset password is rejected THEN should throw error", async () => {

            // arrange
            const RESET_PASSWORD_CODE = "AADB2C90118";

            const userWantsToResetPassword: IError = {
                message: "user forgot password " + RESET_PASSWORD_CODE,
                code: 1234,
            };

            const passwordResetFailed: IError = {
                message: "some error occurred",
                code: 1234,
            };

            mockAcquireTokenAsync
                .mockRejectedValueOnce(userWantsToResetPassword)
                .mockRejectedValueOnce(passwordResetFailed);

            const sut = new MsalPlugin(authority, clientId, policies);

            try {
                // act
                await sut.acquireTokenAsync(scopes, extraQueryParameters,
                    loginHint, MsalUIBehavior.SELECT_ACCOUNT, extraScopesToConsent);
            } catch (error) {
                // assert
                expect(error).toBe(passwordResetFailed);
            }
        });
    });
});

describe("acquireTokenSilentAsync tests", () => {
    test("WHEN acquiring a token silently THEN correct parameters are passed to native module", async () => {

        // arrange
        const userIdentifier = "1234";
        const forceRefresh = true;

        const sut = new MsalPlugin(authority, clientId);

        // act
        await sut.acquireTokenSilentAsync(scopes, userIdentifier, forceRefresh);

        // assert
        expect(mockAcquireTokenSilentAsync).toBeCalledWith(
            authority,
            clientId,
            scopes,
            userIdentifier,
            forceRefresh,
        );
    });
});

describe("tokenCacheDelete tests", () => {
    test("WHEN deleting cache THEN correct parameters are passed to native module", async () => {

        // arrange
        const sut = new MsalPlugin(authority, clientId);

        // act
        await sut.tokenCacheDelete();

        expect(mockTokenCacheDelete).toHaveBeenCalledWith(clientId);
    });
});
