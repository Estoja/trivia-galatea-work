import { QuestionSource } from '../../domain/enums/question-source.enum';
import { QuestionMockService } from './question-mock.service';

describe('QuestionMockService', () => {
  let service: QuestionMockService;

  beforeEach(() => {
    service = new QuestionMockService();
  });

  it('getGalateaQuestions() devuelve el número solicitado de preguntas mock con fuente Galatea', (done) => {
    service.getGalateaQuestions(3).subscribe((questions) => {
      expect(questions).toHaveLength(3);
      expect(questions.every((q) => q.source === QuestionSource.Galatea)).toBe(true);
      expect(questions[0].id).toBe('galatea-mock-0');
      done();
    });
  });

  it('getChosenTopicQuestions() devuelve el número solicitado de preguntas mock con fuente ChosenTopic', (done) => {
    service.getChosenTopicQuestions('Fútbol', 2).subscribe((questions) => {
      expect(questions).toHaveLength(2);
      expect(questions.every((q) => q.source === QuestionSource.ChosenTopic)).toBe(true);
      expect(questions[0].id).toBe('chosen-topic-mock-0');
      done();
    });
  });
});
