package com.zukunftai.evidyalaya.model;

import lombok.Data;

@Data
public class EmailCheckResponse {

    private Boolean userExist;

    private String role;

    public EmailCheckResponse(Boolean userExist, String role) {
        this.userExist = userExist;
        this.role = role;
    }
}