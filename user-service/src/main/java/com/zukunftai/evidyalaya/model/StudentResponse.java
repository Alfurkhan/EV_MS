package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentResponse {

    private Long id;
    private String fullName;
    private String email;
}