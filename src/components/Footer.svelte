<footer class="attribution">
  <div class="footer">
    <img
      class="footer__img"
      src="../assets/icon-facebook.svg"
      alt="Facebook icon"
    />
    <img
      class="footer__img"
      src="../assets/icon-instagram.svg"
      alt="Instagram icon"
    />
    <img
      class="footer__img"
      src="../assets/icon-pinterest.svg"
      alt="Pinterest icon"
    />
  </div>
</footer>

<style type="text/scss">
  footer {
    background: no-repeat url("../assets/pattern-hills.svg");
    background-size: cover;
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .footer {
    margin-top: 3rem;

    &__img {
      height: 30px;
      width: 30px;
      margin-right: 3rem;

      &:last-of-type {
        margin-right: 0;
      }
    }
  }
</style>
