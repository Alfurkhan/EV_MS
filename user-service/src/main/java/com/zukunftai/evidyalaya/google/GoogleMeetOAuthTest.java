package com.zukunftai.evidyalaya.google;

import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.auth.Credentials;
import com.google.auth.oauth2.ClientId;
import com.google.auth.oauth2.DefaultPKCEProvider;
import com.google.auth.oauth2.TokenStore;
import com.google.auth.oauth2.UserAuthorizer;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.apps.meet.v2.SpacesServiceClient;
import com.google.apps.meet.v2.SpacesServiceSettings;

import java.awt.Desktop;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Arrays;

public class GoogleMeetOAuthTest {

    private static final String TOKENS_DIRECTORY_PATH = "tokens";

    private static final List<String> SCOPES =
            Arrays.asList(
                    "openid",
                    "email",
                    "profile"
            );

    private static final String CREDENTIALS_FILE_PATH =
            "/google/credentials.old.json";

    private static final String USER = "default";

    private static final TokenStore TOKEN_STORE =
            new TokenStore() {

                private Path pathFor(String id) {
                    return Paths.get(
                            ".",
                            TOKENS_DIRECTORY_PATH,
                            id + ".json"
                    );
                }

                @Override
                public String load(String id)
                        throws IOException {

                    Path path = pathFor(id);

                    if (!Files.exists(path)) {
                        return null;
                    }

                    return Files.readString(path);
                }

                @Override
                public void store(
                        String id,
                        String token
                ) throws IOException {

                    Files.createDirectories(
                            Paths.get(
                                    ".",
                                    TOKENS_DIRECTORY_PATH
                            )
                    );

                    Files.writeString(
                            pathFor(id),
                            token
                    );
                }

                @Override
                public void delete(String id)
                        throws IOException {

                    Path path = pathFor(id);

                    if (Files.exists(path)) {
                        Files.delete(path);
                    }
                }
            };

    private static UserAuthorizer getAuthorizer(
            URI callbackUri
    ) throws IOException {

        try (InputStream inputStream =
                     GoogleMeetOAuthTest.class
                             .getResourceAsStream(
                                     CREDENTIALS_FILE_PATH
                             )) {

            if (inputStream == null) {
                throw new FileNotFoundException(
                        "Resource not found: "
                                + CREDENTIALS_FILE_PATH
                );
            }

            ClientId clientId =
                    ClientId.fromStream(inputStream);

            return UserAuthorizer
                    .newBuilder()
                    .setClientId(clientId)
                    .setCallbackUri(URI.create(""))
                    .setScopes(SCOPES)
                    .setPKCEProvider(
                            new DefaultPKCEProvider() {
                                @Override
                                public String getCodeChallenge() {
                                    return super
                                            .getCodeChallenge()
                                            .split("=")[0];
                                }
                            }
                    )
                    .setTokenStore(TOKEN_STORE)
                    .build();
        }
    }

    private static Credentials getCredentials()
            throws Exception {

        LocalServerReceiver receiver =
                new LocalServerReceiver.Builder()
                        .build();

        try {

            URI callbackUri =
                    URI.create(
                            receiver.getRedirectUri()
                    );

            UserAuthorizer authorizer =
                    getAuthorizer(callbackUri);

            Credentials credentials =
                    authorizer.getCredentials(USER);

            if (credentials != null) {
                return credentials;
            }

            URL authorizationUrl =
                    authorizer.getAuthorizationUrl(
                            USER,
                            "",
                            callbackUri
                    );

            System.out.println("Authorization host: " + authorizationUrl.getHost());
            System.out.println("Authorization protocol: " + authorizationUrl.getProtocol());

            System.out.println();
            System.out.println(
                    "Opening Google authorization..."
            );

            System.out.println();
            System.out.println("AUTHORIZATION URL:");
            System.out.println(authorizationUrl);
            System.out.println();

            if (
                    Desktop.isDesktopSupported()
                            && Desktop
                            .getDesktop()
                            .isSupported(
                                    Desktop.Action.BROWSE
                            )
            ) {

                Desktop
                        .getDesktop()
                        .browse(
                                authorizationUrl.toURI()
                        );

            } else {

                System.out.println(
                        "Open this URL manually:"
                );

                System.out.println(
                        authorizationUrl
                );
            }

            String code =
                    receiver.waitForCode();

            return authorizer
                    .getAndStoreCredentialsFromCode(
                            USER,
                            code,
                            callbackUri
                    );

        } finally {
            receiver.stop();
        }
    }

    public static void main(String[] args)
            throws Exception {

        System.out.println(
                "Starting Google Meet OAuth test..."
        );

        Credentials credentials =
                getCredentials();

        System.out.println(
                "Google OAuth authorization successful."
        );

        SpacesServiceSettings settings =
                SpacesServiceSettings
                        .newBuilder()
                        .setCredentialsProvider(
                                FixedCredentialsProvider
                                        .create(credentials)
                        )
                        .build();

        try (
                SpacesServiceClient client =
                        SpacesServiceClient.create(
                                settings
                        )
        ) {

            System.out.println(
                    "Google Meet API client created."
            );

            System.out.println(
                    "OAuth test completed successfully."
            );
        }
    }
}