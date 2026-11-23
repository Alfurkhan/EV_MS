package com.zukunftai.evidyalaya.email.model;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum EmailBrandingType {
    SCHOOL,
    PLATFORM;

    @JsonCreator
    public static EmailBrandingType from(String value) {
        if (value == null) return PLATFORM;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return PLATFORM;
        }
    }
}
