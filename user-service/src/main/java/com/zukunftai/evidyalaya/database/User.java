package com.zukunftai.evidyalaya.database;

import com.zukunftai.evidyalaya.model.RegisteredSource;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Set;

@Entity
@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "\"user\"", uniqueConstraints = {
        @UniqueConstraint(columnNames = {
                "username"
        })
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Size(max = 250)
    private String username;

    @JsonIgnore
    private String password;

    @Size(max = 200)
    private String fullName;

    @Size(max = 320)
    @Email
    private String email;

    @Size(max = 10)
    private String countryCode;

    private String phoneNumber;

    private Long rootId;

    @Enumerated(EnumType.STRING)
    private RegisteredSource registeredSource;

    //--------- boolean fields--------

    private boolean accountEnabled;
    private boolean accountLocked;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @LastModifiedDate
    private Instant lastLoginAt;

    private boolean emailVerified;

    private boolean termPolicyViewed;

    //------------MAPPING-------------

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles;

    //---------CONSTRUCTORS---------------------------

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }
}
