package com.zukunftai.evidyalaya.service.api.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PhoneNumberValidation.class)
@Target({ElementType.METHOD, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface IsValidPhoneNumber {
    String message() default "Phone Number Not Valid";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
