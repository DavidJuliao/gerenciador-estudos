package com.estudos.controller;

import com.estudos.model.RegistroEstudo;
import com.estudos.service.RegistroEstudoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/tempo-estudo")
public class RegistroEstudoController {

    private final RegistroEstudoService service;

    public RegistroEstudoController(RegistroEstudoService service) {
        this.service = service;
    }

    @GetMapping
    public List<RegistroEstudo> listar(
            @RequestParam(value = "inicio", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(value = "fim", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        if (inicio != null && fim != null) {
            return service.listarPorIntervalo(inicio, fim);
        }
        return service.listar();
    }

    @GetMapping("/{id}")
    public RegistroEstudo buscar(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<RegistroEstudo> criar(@Valid @RequestBody RegistroEstudo registro) {
        return ResponseEntity.ok(service.salvar(registro));
    }

    @PutMapping("/{id}")
    public RegistroEstudo atualizar(@PathVariable String id, @Valid @RequestBody RegistroEstudo registro) {
        return service.atualizar(id, registro);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
