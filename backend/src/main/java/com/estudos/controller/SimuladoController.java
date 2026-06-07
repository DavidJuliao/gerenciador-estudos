package com.estudos.controller;

import com.estudos.model.Simulado;
import com.estudos.service.SimuladoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/simulados")
public class SimuladoController {

    private final SimuladoService service;

    public SimuladoController(SimuladoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Simulado> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public Simulado buscar(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<Simulado> criar(@Valid @RequestBody Simulado simulado) {
        return ResponseEntity.ok(service.salvar(simulado));
    }

    @PutMapping("/{id}")
    public Simulado atualizar(@PathVariable String id, @Valid @RequestBody Simulado simulado) {
        return service.atualizar(id, simulado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
