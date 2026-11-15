package com.zukunftai.evidyalaya.service.impl;

import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Runs the master changelog against a disposable PostgreSQL database and
 * verifies that every planned activity source is accepted by the constraint.
 */
@EnabledIfEnvironmentVariable(named = "ASSESSMENT_MIGRATION_TEST_URL", matches = ".+")
class NotificationLiquibaseMigrationTest {

    @Test
    void masterChangelogAllowsAcademicActivityNotificationSources() throws Exception {
        String url = System.getenv("ASSESSMENT_MIGRATION_TEST_URL");
        String username = System.getenv("ASSESSMENT_MIGRATION_TEST_USERNAME");
        String password = System.getenv("ASSESSMENT_MIGRATION_TEST_PASSWORD");

        try (Connection connection = DriverManager.getConnection(url, username, password)) {
            Database database = DatabaseFactory.getInstance()
                    .findCorrectDatabaseImplementation(new JdbcConnection(connection));
            Liquibase liquibase = new Liquibase(
                    "db/changelog/db.changelog-master.xml",
                    new ClassLoaderResourceAccessor(),
                    database);
            liquibase.update(new Contexts(), new LabelExpression());

            String definition;
            try (PreparedStatement statement = connection.prepareStatement(
                    "SELECT pg_get_constraintdef(oid) FROM pg_constraint "
                            + "WHERE conrelid = 'notification'::regclass "
                            + "AND conname = 'chk_notification_source'");
                 ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    throw new AssertionError("Notification source constraint was not created.");
                }
                definition = result.getString(1);
            }

            for (String source : new String[]{
                    "SYSTEM", "ANNOUNCEMENT", "MANUAL", "ASSIGNMENT",
                    "ASSESSMENT", "TIMETABLE", "CLASS_SESSION",
                    "SUBJECT", "ATTENDANCE", "RESULT"
            }) {
                assertTrue(definition.contains("'" + source + "'"),
                        "Expected notification source to be allowed: " + source);
            }

            assertTrue(tableExists(connection, "email_notification_outbox"),
                    "Email notification outbox table should be created by the master changelog.");
            assertTrue(tableExists(connection, "email_notification_attempt"),
                    "Email notification attempt history table should be created by the master changelog.");

            String outboxStatusConstraint;
            try (PreparedStatement statement = connection.prepareStatement(
                    "SELECT pg_get_constraintdef(oid) FROM pg_constraint "
                            + "WHERE conrelid = 'email_notification_outbox'::regclass "
                            + "AND conname = 'chk_email_outbox_status'");
                 ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    throw new AssertionError("Email outbox status constraint was not created.");
                }
                outboxStatusConstraint = result.getString(1);
            }

            for (String status : new String[]{"PENDING", "PROCESSING", "SENT", "FAILED", "SKIPPED"}) {
                assertTrue(outboxStatusConstraint.contains("'" + status + "'"),
                        "Expected email outbox status to be allowed: " + status);
            }
        }
    }

    private boolean tableExists(Connection connection, String tableName) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT to_regclass(?) IS NOT NULL")) {
            statement.setString(1, tableName);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() && result.getBoolean(1);
            }
        }
    }
}
