package com.zukunftai.evidyalaya.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;
import java.util.Set;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {
    private ObjectMapper objectMapper = new ObjectMapper();
    @Override
    public String convertToDatabaseColumn(List<String> strings) {
        if(strings == null || strings.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(strings);
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert List<String> to String", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String s) {
        if(s == null) return null;
        try {
            return objectMapper.readValue(s, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert String to List<String>", e);
        }
    }
}
