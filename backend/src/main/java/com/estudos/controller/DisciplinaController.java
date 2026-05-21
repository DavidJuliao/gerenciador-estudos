package com.estudos.controller;

import com.estudos.model.Disciplina;
import com.estudos.service.DisciplinaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/disciplinas")
public class DisciplinaController {

    private final DisciplinaService service;

    public DisciplinaController(DisciplinaService service) {
        this.service = service;
    }

    @GetMapping
    public List<Disciplina> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public Disciplina buscar(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @GetMapping("/grupo/{numero}")
    public List<Disciplina> listarPorGrupo(@PathVariable Integer numero) {
        return service.listarPorGrupo(numero);
    }

    @PostMapping
    public ResponseEntity<Disciplina> criar(@Valid @RequestBody Disciplina disciplina) {
        return ResponseEntity.ok(service.salvar(disciplina));
    }

    @PutMapping("/{id}")
    public Disciplina atualizar(@PathVariable String id, @Valid @RequestBody Disciplina disciplina) {
        return service.atualizar(id, disciplina);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
