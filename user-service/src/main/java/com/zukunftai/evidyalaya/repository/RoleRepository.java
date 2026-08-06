package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName roleName);

    Set<Role> findAllByNameIn(RoleName... roleNames);
}