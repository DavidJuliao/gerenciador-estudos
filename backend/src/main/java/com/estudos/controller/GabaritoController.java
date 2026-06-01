package com.estudos.controller;

import com.estudos.model.Gabarito;
import com.estudos.service.GabaritoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/gabaritos")
public class GabaritoController {

    private final GabaritoService service;

    public GabaritoController(GabaritoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Gabarito> listar(@RequestParam(required = false) String disciplina) {
        if (disciplina != null && !disciplina.isBlank()) {
            return service.listarPorDisciplina(disciplina);
        }
        return service.listar();
    }

    @GetMapping("/{id}")
    public Gabarito buscar(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<Gabarito> criar(@Valid @RequestBody Gabarito gabarito) {
        return ResponseEntity.ok(service.salvar(gabarito));
    }

    @PutMapping("/{id}")
    public Gabarito atualizar(@PathVariable String id, @Valid @RequestBody Gabarito gabarito) {
        return service.atualizar(id, gabarito);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
