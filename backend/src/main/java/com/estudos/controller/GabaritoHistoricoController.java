package com.estudos.controller;

import com.estudos.model.GabaritoHistorico;
import com.estudos.service.GabaritoHistoricoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class GabaritoHistoricoController {

    private final GabaritoHistoricoService service;

    public GabaritoHistoricoController(GabaritoHistoricoService service) {
        this.service = service;
    }

    @GetMapping("/gabaritos/{gabaritoId}/historicos")
    public List<GabaritoHistorico> listar(@PathVariable String gabaritoId) {
        return service.listarPorGabarito(gabaritoId);
    }

    @PostMapping("/gabaritos/{gabaritoId}/historicos")
    public ResponseEntity<GabaritoHistorico> criar(@PathVariable String gabaritoId,
                                                   @RequestBody GabaritoHistorico historico) {
        return ResponseEntity.ok(service.criar(gabaritoId, historico));
    }

    @GetMapping("/historicos/{id}")
    public GabaritoHistorico buscar(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/historicos/{id}")
    public GabaritoHistorico atualizar(@PathVariable String id,
                                       @RequestBody GabaritoHistorico historico) {
        return service.atualizar(id, historico);
    }

    @DeleteMapping("/historicos/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
