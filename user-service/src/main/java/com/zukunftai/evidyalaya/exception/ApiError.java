package com.zukunftai.evidyalaya.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

class ApiError {

    private HttpStatus status;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy hh:mm:ss")
    private LocalDateTime timestamp;
    private String message;
    private String errorCode;
    private Map<String, String> obj = new HashMap<>();

    private ApiError() {
        timestamp = LocalDateTime.now();
    }

    ApiError(HttpStatus status) {
        this();
        this.status = status;
    }

    ApiError(HttpStatus status, Throwable ex) {
        this();
        this.status = status;
        this.message = "Unexpected error";
    }

    ApiError(HttpStatus status, String message, Throwable ex) {
        this();
        this.status = status;
        this.message = message;
    }

    ApiError(HttpStatus status, String message, String errorCode, Map<String, String> obj) {
        this();
        this.status = status;
        this.message = message;
        this.errorCode = errorCode;
        this.obj = obj;

    }

    public HttpStatus getStatus() {
        return status;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getMessage() {
        return message;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public Map<String, String> getObjectParams() {
        return obj;
    }
}