package pl.jakub.ambulancemanagement.users.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private String firstName;

    @NotNull
    private String lastName;

    @Column(name = "username", nullable = false,  unique = true)
    private String username;
    @Email
    @Column(unique = true)
    private String email;

    @NotNull
    private String passwordHash;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name= "role", nullable = false)
    private UserRole userRole;

    @NotNull
    private LocalDateTime createdAt =  LocalDateTime.now();

    @NotNull
    private Boolean active = true;

    @NotNull
    private Boolean mustChangePassword = true;
}
