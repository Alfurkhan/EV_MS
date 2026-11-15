package com.zukunftai.evidyalaya.model;
import jakarta.validation.constraints.*;
public record ManualNotificationRequest(@NotNull Long userId, @NotBlank @Size(max=200) String title,
 @NotBlank @Size(max=1000) String message, @NotBlank @Size(max=30) String category,
 @NotBlank @Pattern(regexp="NORMAL|IMPORTANT|URGENT") String priority, @Size(max=500) String targetUrl) {}
