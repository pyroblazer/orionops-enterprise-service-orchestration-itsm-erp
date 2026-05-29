package com.orionops.modules.workflow.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BusinessRuleEngine {

    private final Map<UUID, Map<String, Object>> rules = new HashMap<>();

    @Transactional
    public void evaluateRules(String eventType, Map<String, Object> context) {
        for (Map.Entry<UUID, Map<String, Object>> rule : rules.entrySet()) {
            if (matches(rule.getValue(), eventType, context)) {
                executeActions(rule.getValue(), context);
            }
        }
        log.info("Business rules evaluated for {}", eventType);
    }

    private boolean matches(Map<String, Object> rule, String eventType, Map<String, Object> context) {
        String triggerEvent = (String) rule.get("trigger_event");
        return triggerEvent.equals(eventType);
    }

    private void executeActions(Map<String, Object> rule, Map<String, Object> context) {
        List<?> actions = (List<?>) rule.get("actions");
        if (actions != null) {
            for (Object action : actions) {
                log.info("Executing action: {}", action);
            }
        }
    }
}
