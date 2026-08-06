package com.zukunftai.evidyalaya.service.api;

public interface ConverterService<S, T> {

    T convert(S source);
}