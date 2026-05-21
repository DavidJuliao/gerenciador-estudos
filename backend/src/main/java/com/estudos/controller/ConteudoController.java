package com.estudos.controller;

import com.estudos.model.Conteudo;
import com.estudos.service.ConteudoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/conteudos")
public class ConteudoController {

    private final ConteudoService service;

    public ConteudoController(ConteudoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Conteudo> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public Conteudo buscar(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @GetMapping("/disciplina")
    public List<Conteudo> listarPorDisciplina(@RequestParam("nome") String nome) {
        return service.listarPorDisciplina(nome);
    }

    @GetMapping("/disciplinas-distinct")
    public List<String> listarDisciplinasDistinct() {
        return service.listarDisciplinasDistinct();
    }

    @PostMapping
    public ResponseEntity<Conteudo> criar(@Valid @RequestBody Conteudo conteudo) {
        return ResponseEntity.ok(service.salvar(conteudo));
    }

    @PutMapping("/{id}")
    public Conteudo atualizar(@PathVariable String id, @Valid @RequestBody Conteudo conteudo) {
        return service.atualizar(id, conteudo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
