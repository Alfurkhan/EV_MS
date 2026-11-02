package com.zukunftai.evidyalaya.service.impl;

import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.exception.LiquibaseException;
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
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Runs the complete master changelog against a fresh, disposable PostgreSQL database.
 * Enabled only in CI (or when the three ASSESSMENT_MIGRATION_TEST_* variables are set).
 */
@EnabledIfEnvironmentVariable(named = "ASSESSMENT_MIGRATION_TEST_URL", matches = ".+")
class AssessmentLiquibaseMigrationTest {

    @Test
    void masterChangelogCreatesAssessmentSchemaAndForeignKeys() throws Exception {
        String url = System.getenv("ASSESSMENT_MIGRATION_TEST_URL");
        String username = System.getenv("ASSESSMENT_MIGRATION_TEST_USERNAME");
        String password = System.getenv("ASSESSMENT_MIGRATION_TEST_PASSWORD");

        try (Connection connection = DriverManager.getConnection(url, username, password)) {
            Database database = DatabaseFactory.getInstance()
                    .findCorrectDatabaseImplementation(new JdbcConnection(connection));
            Liquibase liquibase = new Liquibase(
                    "db/changelog/db.changelog-master.xml",
                    new ClassLoaderResourceAccessor(),
                    database
            );

            try {
                liquibase.update(new Contexts(), new LabelExpression());
            } catch (LiquibaseException exception) {
                exception.printStackTrace();
                throw exception;
            }

            assertTrue(tableExists(connection, "assessment"));
            assertTrue(tableExists(connection, "assessment_question"));
            assertTrue(tableExists(connection, "assessment_attempt"));
            assertTrue(tableExists(connection, "assessment_answer"));

            assertTrue(constraintExists(connection, "fk_assessment_subject"));
            assertTrue(constraintExists(connection, "fk_assessment_faculty"));
            assertTrue(constraintExists(connection, "fk_attempt_student"));
            assertTrue(constraintExists(connection, "fk_answer_evaluated_by"));

            assertEquals(8, assessmentChangeSetCount(connection));
        }
    }

    private boolean tableExists(Connection connection, String tableName) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT to_regclass(?) IS NOT NULL")) {
            statement.setString(1, "public." + tableName);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getBoolean(1);
            }
        }
    }

    private boolean constraintExists(Connection connection, String constraintName) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ?)")) {
            statement.setString(1, constraintName);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getBoolean(1);
            }
        }
    }

    private int assessmentChangeSetCount(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement();
             ResultSet result = statement.executeQuery(
                     "SELECT COUNT(*) FROM databasechangelog WHERE id LIKE 'assessments-%'")) {
            result.next();
            return result.getInt(1);
        }
    }
}
