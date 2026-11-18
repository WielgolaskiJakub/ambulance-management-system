package pl.jakub.ambulancemanagement.users.dto;

import jakarta.validation.constraints.NotNull;

public record UserRestoreOperationsPermissionRequest(
        @NotNull
        Boolean canRestoreOperations
) {
}
