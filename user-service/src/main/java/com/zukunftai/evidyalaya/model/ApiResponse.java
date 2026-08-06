package com.zukunftai.evidyalaya.model;

import lombok.*;
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Builder
public class ApiResponse<T> {
    private T data;
}
