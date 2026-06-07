package com.estudos.controller;

import com.estudos.model.SimuladoHistorico;
import com.estudos.service.SimuladoHistoricoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SimuladoHistoricoController {

    private final SimuladoHistoricoService service;

    public SimuladoHistoricoController(SimuladoHistoricoService service) {
        this.service = service;
    }

    @GetMapping("/simulados/{simuladoId}/historicos")
    public List<SimuladoHistorico> listar(@PathVariable String simuladoId) {
        return service.listarPorSimulado(simuladoId);
    }

    @PostMapping("/simulados/{simuladoId}/historicos")
    public ResponseEntity<SimuladoHistorico> criar(@PathVariable String simuladoId,
                                                   @RequestBody SimuladoHistorico historico) {
        return ResponseEntity.ok(service.criar(simuladoId, historico));
    }

    @GetMapping("/simulado-historicos/{id}")
    public SimuladoHistorico buscar(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/simulado-historicos/{id}")
    public SimuladoHistorico atualizar(@PathVariable String id,
                                       @RequestBody SimuladoHistorico historico) {
        return service.atualizar(id, historico);
    }

    @DeleteMapping("/simulado-historicos/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
