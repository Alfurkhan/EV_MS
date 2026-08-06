package com.zukunftai.evidyalaya.service.api.validator;


import com.zukunftai.evidyalaya.exception.ErrorCodesAndMessages;
import com.zukunftai.evidyalaya.exception.APIException;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.http.HttpStatus;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PhoneNumberValidation implements ConstraintValidator<IsValidPhoneNumber, String> {
    private static final String PHONE_NUMBER_PATTERN = "^[0-9]{10,12}$";
    private Pattern pattern;
    private Matcher matcher;
    private boolean MatcherValue;

    public PhoneNumberValidation() {
        pattern = Pattern.compile(PHONE_NUMBER_PATTERN);
    }

    @Override
    public void initialize(IsValidPhoneNumber isValidPhoneNumber) {
        isValidPhoneNumber.message();
    }

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext cxt) {
        pattern = Pattern.compile(PHONE_NUMBER_PATTERN);
        
        if (phoneNumber == null) {
            return true;
        }
        matcher = pattern.matcher(phoneNumber);
        MatcherValue = matcher.matches();
        if (MatcherValue) {
            return true;
        }
        throw new APIException(ErrorCodesAndMessages.ERROR_MESSAGE_PHONE_OR_NUMBER_NOT_VALID_001, HttpStatus.CONFLICT, ErrorCodesAndMessages.ERROR_CODE_PHONE_OR_MOBILE_NUMBER_NOT_VALID_001);
    }
}
