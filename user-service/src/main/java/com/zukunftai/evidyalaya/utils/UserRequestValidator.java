package com.zukunftai.evidyalaya.utils;

import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages;
import com.zukunftai.evidyalaya.model.RegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;
import java.util.Date;
@Component
public class UserRequestValidator {

    public static void validateRegisterRequest(RegisterRequest registerRequest) {
        if ((registerRequest.getFullName()==null || registerRequest.getFullName().isEmpty())) {
            throw new APIException(ErrorCodesAndMessages.ERROR_CODE_MISSING_FULL_NAME, HttpStatus.BAD_REQUEST, ErrorCodesAndMessages.ERROR_MESSAGE_MISSING_FULL_NAME);

        }


    }
    private static boolean isValidDateOfBirth(Date dateOfBirth) {
        if (dateOfBirth == null) {
            return false;
        }

        long currentTimeMillis = System.currentTimeMillis();
        long dobTimeMillis = dateOfBirth.getTime();
        long ageInMillis = currentTimeMillis - dobTimeMillis;

        long ageInYears = ageInMillis / (1000L * 60 * 60 * 24 * 365);
        return ageInYears >= 18;
    }
}
