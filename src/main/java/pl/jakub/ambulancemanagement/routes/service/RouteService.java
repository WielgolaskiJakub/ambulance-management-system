package pl.jakub.ambulancemanagement.routes.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.routes.dto.RouteCreateRequest;
import pl.jakub.ambulancemanagement.routes.dto.RouteFinishRequest;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.routes.repository.RouteRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.repository.TransportOrderRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final ShiftRepository shiftRepository;


    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public Route getRouteById(java.lang.Long id) {
        return  routeRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.ROUTE_NOT_FOUND));
    }

    @Transactional
    public Route createRoute(RouteCreateRequest request) {

        Route route = new Route();

        TransportOrder transportOrder = transportOrderRepository.findById(request.getTransportOrderId())
                .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

      if(transportOrder.getStatus() != TransportStatus.NEW){
          throw new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_AVAILABLE);
      }

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));

        if (shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }

        route.setTransportOrder(transportOrder);
        route.setShift(shift);
        route.setStartAddress(request.getStartAddress());
        route.setActualDestinationAddress(request.getActualDestinationAddress());
        route.setNotes(request.getNotes());

        route.setStatus(RouteStatus.CREATED);

        return routeRepository.save(route);
    }

    @Transactional
    public Route startRoute(Long id){
        Route route = getRouteById(id);

        if(route.getStatus() != RouteStatus.CREATED){
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_STARTED);
        }

        TransportOrder transportOrder = route.getTransportOrder();

        if(transportOrder.getStatus() != TransportStatus.NEW){
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_AVAILABLE);
        }

        route.setStartedAt(LocalDateTime.now());
        route.setStatus(RouteStatus.IN_PROGRESS);

        transportOrder.setStatus(TransportStatus.IN_PROGRESS);

        return routeRepository.save(route);
    }

    @Transactional
    public Route finishRoute(Long id, RouteFinishRequest request){
        Route route = getRouteById(id);

        if(route.getStatus() != RouteStatus.IN_PROGRESS){
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_FINISHED);
        }

        TransportOrder transportOrder = route.getTransportOrder();

        if(transportOrder.getStatus() != TransportStatus.IN_PROGRESS){
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_CANNOT_BE_FINISHED);
        }

        LocalDateTime now = LocalDateTime.now();

        route.setFinishedAt(now);
        route.setStatus(RouteStatus.COMPLETED);
        route.setDistanceKm(request.getDistanceKm());

        if(request.getNotes() != null){
            route.setNotes(normalizeNullableText(request.getNotes()));
        }

        transportOrder.setStatus(TransportStatus.COMPLETED);
        transportOrder.setCompletedAt(now);

        return routeRepository.save(route);
    }

    private String normalizeNullableText(String value){

        if(value == null || value.isBlank()){
            return null;
        }
        return value.trim();
    }
}
