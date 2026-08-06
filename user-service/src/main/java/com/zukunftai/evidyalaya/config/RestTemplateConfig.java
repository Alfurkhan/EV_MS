package com.zukunftai.evidyalaya.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

	@Value("${rest.client.connect-timeout}")
	private int connectTimeout;

	@Value("${rest.client.read-timeout}")
	private int readTimeout;

	@Bean
	public RestTemplate restTemplate(RestTemplateBuilder builder) {
		return builder
				.connectTimeout(Duration.ofSeconds(connectTimeout))
				.readTimeout(Duration.ofSeconds(readTimeout))
				.build();
	}
}