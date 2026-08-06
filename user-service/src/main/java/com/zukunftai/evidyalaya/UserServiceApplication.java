package com.zukunftai.evidyalaya;


import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.repository.RoleRepository;
import com.zukunftai.evidyalaya.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@SpringBootApplication(scanBasePackages = {
        "com.zukunftai.evidyalaya.config",
        "com.zukunftai.evidyalaya.controller",
        "com.zukunftai.evidyalaya.database",
        "com.zukunftai.evidyalaya.exception",
        "com.zukunftai.evidyalaya.repository",
        "com.zukunftai.evidyalaya.model",
        "com.zukunftai.evidyalaya.service"
})
@EnableAsync
public class  UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
    @Autowired
    RoleRepository roleRepository;
    @Autowired
    UserService userService;
    @Bean
    public CommandLineRunner commandLineRunner(

    ) {
        return args -> {


            Set<Role> roleSet = roleRepository.findAllByNameIn(RoleName.values());

            Set<RoleName> roleNames = Stream.of(RoleName.values())
                    .filter(roleName -> roleSet.stream()
                            .noneMatch(role -> role.getName().equals(roleName))).collect(Collectors.toSet());
            roleNames.stream().forEach(roleName -> {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.saveAndFlush(role);
            });
        };
    }
}
