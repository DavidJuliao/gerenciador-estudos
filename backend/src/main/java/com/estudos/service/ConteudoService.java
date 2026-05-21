package com.estudos.service;

import com.estudos.model.Conteudo;
import com.estudos.repository.ConteudoRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConteudoService {

    private final ConteudoRepository repository;

    public ConteudoService(ConteudoRepository repository) {
        this.repository = repository;
    }

    public List<Conteudo> listar() {
        return repository.findAll();
    }

    public Conteudo buscarPorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conteúdo não encontrado com id: " + id));
    }

    public List<Conteudo> listarPorDisciplina(String disciplina) {
        return repository.findByDisciplina(disciplina);
    }

    public List<String> listarDisciplinasDistinct() {
        return repository.findAll().stream()
                .map(Conteudo::getDisciplina)
                .filter(d -> d != null && !d.isBlank())
                .distinct()
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toList());
    }

    public Conteudo salvar(Conteudo conteudo) {
        return repository.save(conteudo);
    }

    public Conteudo atualizar(String id, Conteudo conteudo) {
        Conteudo existente = buscarPorId(id);
        existente.setDisciplina(conteudo.getDisciplina());
        existente.setDescricao(conteudo.getDescricao());
        existente.setPrioridade(conteudo.getPrioridade());
        existente.setTipo(conteudo.getTipo());
        existente.setConteudoPaiId(conteudo.getConteudoPaiId());
        existente.setDataEstudada(conteudo.getDataEstudada());
        existente.setDataEstudadaAnterior(conteudo.getDataEstudadaAnterior());
        existente.setMarcado(conteudo.isMarcado());
        existente.setQuestoes(conteudo.getQuestoes());
        return repository.save(existente);
    }

    public void excluir(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Conteúdo não encontrado com id: " + id);
        }
        // Se o conteúdo excluído é um CONTEUDO pai, remove em cascata os
        // subconteúdos que o referenciam (deixar órfãos quebraria a UI).
        repository.findAll().stream()
                .filter(c -> id.equals(c.getConteudoPaiId()))
                .forEach(c -> repository.deleteById(c.getId()));
        repository.deleteById(id);
    }
}
