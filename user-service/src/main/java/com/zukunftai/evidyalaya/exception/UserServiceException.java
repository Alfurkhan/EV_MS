package com.zukunftai.evidyalaya.exception;

import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

public abstract class UserServiceException extends RuntimeException {

    private HttpStatus responseHttpStatus;
    private String message;
    private String errorCode;
    private Map<String, String> obj = new HashMap<>();

    public UserServiceException(String message, HttpStatus responseHttpStatus) {
        super(message);
        this.responseHttpStatus = responseHttpStatus;
    }

    public UserServiceException(String message, HttpStatus responseHttpStatus, String errorCode, Map<String, String> obj) {
        super(message);
        this.responseHttpStatus = responseHttpStatus;
        this.message = message;
        this.errorCode = errorCode;
        this.obj = obj;
    }

    public UserServiceException(String message, HttpStatus responseHttpStatus, String errorCode) {
        super(message);
        this.responseHttpStatus = responseHttpStatus;
        this.message = message;
        this.errorCode = errorCode;
    }

    public HttpStatus getResponseHttpStatus() {
        return responseHttpStatus;
    }

    public Map<String, String> getResponseParam() {
        return obj;
    }

    public String getResponseErrorCode() {
        return errorCode;

    }
}