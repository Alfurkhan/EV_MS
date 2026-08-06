package com.zukunftai.evidyalaya.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;


@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig implements AsyncConfigurer {

    @Value("${async.executor.email.corePoolSize:5}")
    private int emailCorePoolSize;

    @Value("${async.executor.email.maxPoolSize:20}")
    private int emailMaxPoolSize;

    @Value("${async.executor.email.queueCapacity:100}")
    private int emailQueueCapacity;

    @Override
    public Executor getAsyncExecutor() {
        return mailExecutor();
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            log.error("Async Exception in {}", method.getName(), ex);
        };
    }
    @Bean(name = "mailExecutor")
    public Executor mailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(emailCorePoolSize);
        executor.setMaxPoolSize(emailMaxPoolSize);
        executor.setQueueCapacity(emailQueueCapacity);
        executor.setThreadNamePrefix("AsyncMail-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
