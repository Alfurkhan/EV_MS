package com.zukunftai.evidyalaya.exception;

import org.springframework.http.HttpStatus;

public class APIException extends UserServiceException {

    public APIException(String message, HttpStatus responseHttpStatus, String errorCode) {

        super(message, responseHttpStatus, errorCode);
    }
}
