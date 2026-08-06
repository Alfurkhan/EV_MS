package com.zukunftai.evidyalaya.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class RestExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(value = {UserServiceException.class})
    protected ResponseEntity<Object> handleConflict(UserServiceException ex) {
        return buildResponseEntity(new ApiError(ex.getResponseHttpStatus(), ex.getMessage(), ex.getResponseErrorCode() , ex.getResponseParam()));
    }
    private ResponseEntity<Object> buildResponseEntity(ApiError apiError) {
        return new ResponseEntity<>(apiError, apiError.getStatus());
    }


    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("timestamp", System.currentTimeMillis());
        responseBody.put("status", status.value());
        responseBody.put("errors", errors);

        return new ResponseEntity<>(responseBody, headers, status);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        String message = "Invalid request payload";

        Throwable cause = ex.getCause();

        if (cause != null && cause.getMessage() != null) {

            if (cause.getMessage().contains("Gender is required")) {
                message = "Gender is required";
            }
            else if (cause.getMessage().contains("Gender must be")) {
                message = "Gender must be MALE, FEMALE or OTHERS";
            }
        }

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST,
                message,
                "INVALID_REQUEST_BODY",
                null
        );

        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }
}
