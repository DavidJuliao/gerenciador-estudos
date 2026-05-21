package com.estudos.service;

import com.estudos.model.Disciplina;
import com.estudos.repository.DisciplinaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DisciplinaService {

    private final DisciplinaRepository repository;

    public DisciplinaService(DisciplinaRepository repository) {
        this.repository = repository;
    }

    public List<Disciplina> listar() {
        return repository.findAll();
    }

    public Disciplina buscarPorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Disciplina não encontrada com id: " + id));
    }

    public List<Disciplina> listarPorGrupo(Integer grupo) {
        return repository.findByGrupo(grupo);
    }

    public Disciplina salvar(Disciplina disciplina) {
        return repository.save(disciplina);
    }

    public Disciplina atualizar(String id, Disciplina disciplina) {
        Disciplina existente = buscarPorId(id);
        existente.setNome(disciplina.getNome());
        existente.setGrupo(disciplina.getGrupo());
        return repository.save(existente);
    }

    public void excluir(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Disciplina não encontrada com id: " + id);
        }
        repository.deleteById(id);
    }
}
