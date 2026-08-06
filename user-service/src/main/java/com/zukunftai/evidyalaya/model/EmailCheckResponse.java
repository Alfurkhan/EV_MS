package com.zukunftai.evidyalaya.model;

import lombok.Data;

@Data
public class EmailCheckResponse {
    private Boolean userExist;

    public EmailCheckResponse(Boolean dataBaseExist) {
        this.userExist = dataBaseExist;
    }
}

