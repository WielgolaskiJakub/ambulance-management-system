package pl.jakub.ambulancemanagement.dashboards.dto;

import pl.jakub.ambulancemanagement.route_members.model.RouteMember;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.shifts.model.Shift;

import java.time.LocalDateTime;
import java.util.List;

public record ManagerAmbulanceDashboardResponse(

        Long shiftId,
        Long ambulanceId,
        String registrationPlates,
        String carBrand,
        String model,
        String driverFullName,
        List<CrewMember> crewMembers,
        List<CurrentTransportOrder> currentTransportOrders,
        LocalDateTime routeAcceptedAt,
        RouteStatus currentRouteStatus,
        LocalDateTime routeStartedAt,
        String routeStartAddress,
        String routeDestinationAddress
) {
    public static ManagerAmbulanceDashboardResponse from(
            Shift shift,
            List<CrewMember> crewMembers,
            Route currentRoute,
            List<CurrentTransportOrder> currentTransportOrders
    ) {
        return new ManagerAmbulanceDashboardResponse(
                shift.getId(),
                shift.getAmbulance().getId(),
                shift.getAmbulance().getRegistrationPlates(),
                shift.getAmbulance().getCarBrand(),
                shift.getAmbulance().getModel(),
                shift.getDriver().getFirstName() + " " + shift.getDriver().getLastName(),
                crewMembers,
                currentTransportOrders,
                currentRoute == null ? null : currentRoute.getCreatedAt(),
                currentRoute == null ? null : currentRoute.getStatus(),
                currentRoute == null ? null : currentRoute.getStartedAt(),
                currentRoute == null ? null : currentRoute.getStartAddress(),
                currentRoute == null ? null : currentRoute.getActualDestinationAddress()
        );
    }

    public record CrewMember(
            String fullName,
            RouteMemberRole role
    ) {
        public static CrewMember fromShiftDefaultMember(
                ShiftDefaultMember member
        ){
            return new CrewMember(
                    member.getUser().getFirstName()
                    + " "
                    + member.getUser().getLastName(),
                    member.getRole()
            );
        }
        public static CrewMember fromRouteMember(RouteMember member){
            String fullName =  member.getUser() != null
                    ? member.getUser().getFirstName()
                    + " "
                    + member.getUser().getLastName()
                    : member.getMemberName();
            return new CrewMember(fullName, member.getRole());
        }
    }

    public record CurrentTransportOrder(
            Long id,
            String orderNumber
    ){
        public static CurrentTransportOrder fromRouteOrder(RouteOrder routeOrder){
            return new CurrentTransportOrder(
                    routeOrder.getTransportOrder().getId(),
                    routeOrder.getTransportOrder().getOrderNumber()
            );
        }
    }
}
