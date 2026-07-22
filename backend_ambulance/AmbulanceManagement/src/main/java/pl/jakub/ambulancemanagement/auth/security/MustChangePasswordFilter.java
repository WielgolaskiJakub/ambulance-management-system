package pl.jakub.ambulancemanagement.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.exception.ErrorResponse;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class MustChangePasswordFilter extends OncePerRequestFilter {

    private static final String API_PREFIX = "/api/v1/";
    private static final String CHANGE_TEMPORARY_PASSWORD_PATH =
            "/api/v1/users/me/temporary-password";

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
            ) throws ServletException, IOException {

        String requestURI = request.getRequestURI();

        if(!requestURI.startsWith(API_PREFIX)
        || HttpMethod.OPTIONS.matches(request.getMethod())
        || isTemporaryPasswordChangeRequest(request)){

            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String username = authentication != null
                ? authentication.getName()
                : null;

        if(username == null){
            filterChain.doFilter(request, response);
            return;
        }

        User user =  userRepository.findByUsername(username).orElse(null);

        if(user != null && Boolean.TRUE.equals(user.getMustChangePassword())){
            sendPasswordChangeRequiredResponse(response);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isTemporaryPasswordChangeRequest(HttpServletRequest request){
        return HttpMethod.PATCH.matches(request.getMethod())
                && CHANGE_TEMPORARY_PASSWORD_PATH.equals(request.getRequestURI());
    }

    private void sendPasswordChangeRequiredResponse(
            HttpServletResponse response
    ) throws IOException {
        response.setStatus(ErrorCode.PASSWORD_CHANGE_REQUIRED
                .getHttpStatus()
                .value());

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ErrorResponse errorResponse = new ErrorResponse(
                ErrorCode.PASSWORD_CHANGE_REQUIRED.getCode(),
                "Najpierw musisz ustawić własne hasło",
                LocalDateTime.now()
        );

        objectMapper.writeValue(response.getWriter(), errorResponse);
    }
}
